import { BadGatewayException, Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { QueryDTO } from 'src/dto/query-dto';
import { CatchPrismaError } from 'src/error-catch.decorator';
import { FormatResponse } from 'src/format-response.decorator';
import { PrismaService } from 'src/prisma.service';
import { saveFile } from 'src/utils/filehandler';

@Injectable()
export class KatarakService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(user_id: string, query: QueryDTO) {
    const result = await this.prisma.history_katarak.findMany({
      where: {
        user: {
          uuid: user_id,
        },
      },

      skip: query.limit * (query.page - 1),
      take: query.limit,
    });

    return {
        data : result,
        count : await this.prisma.history_katarak.count({
            where : {
                user : {
                    uuid : user_id
                }
            }
        })
    }

  }

  private predictFile(path: string) {
    return new Promise((resolve, reject) => {
      exec(
        `npx cross-env TF_ENABLE_ONEDNN_OPTS=0 python src/python/predict.py ${path}`,
        (error, stdout, stderr) => {
          if (error) {
            unlinkSync(path);
            reject(`Error: ${stderr}`);
          } else {
            const regex = /\[\[(.*?)\]\]/g;
            const matches = stdout.match(regex);

            if (matches) {
              const value = matches
                .map((match) => {
                  const value = match.slice(2, -2); // Remove the surrounding [[ and ]]
                  return value;
                })
                .join();
              resolve(
                value
                  .split(',')
                  .map(Number)
                  .map((value) => {
                    console.log(value < 0.00001);
                    return (value < 0 && 0) || value;
                  }),
              );
              return;
            }
            reject('Masalah dalam prediksi');
          }
        },
      );
    });
  }

  @CatchPrismaError()
  @FormatResponse()
  async predict(user_id: string, file: Express.Multer.File) {
    const image = saveFile(file);
    const tempImagePath = join(process.cwd(), 'uploads', image);
    const prediction = await this.predictFile(tempImagePath);
    const result = prediction as string | number[];
    if (typeof result == 'string') {
      throw new BadGatewayException('Gagal');
    }

    const history = await this.prisma.history_katarak.create({
      data: {
        nama_file: image,
        immature: result[0],
        mature: result[1],
        normal: result[2],
        user: {
          connect: {
            uuid: user_id,
          },
        },
      },
    });

    return history;
  }
}
