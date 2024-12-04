import { BadGatewayException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { exec } from 'child_process';
import { join } from 'path';
import { KatarakService } from './katarak.service';
import { unlinkSync, writeFileSync } from 'fs';
import { PredictDto } from './dto/predict.dto';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('api/katarak')
@ApiBearerAuth()
export class KatarakController {
  constructor(private readonly katarakService: KatarakService) { }

  @Post('predict')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async predict(@UploadedFile() file: Express.Multer.File) {
    const tempImagePath = join(process.cwd(), 'uploads', file.originalname);

    // Write the file buffer to a temporary file
    writeFileSync(tempImagePath, file.buffer);

    const prediction  = new Promise((resolve, reject) => {
      exec(`npx cross-env TF_ENABLE_ONEDNN_OPTS=0 python src/python/predict.py ${tempImagePath}`, (error, stdout, stderr) => {
        // Delete the temporary file after prediction
        unlinkSync(tempImagePath);

        if (error) {
          reject(`Error: ${stderr}`);
        } else {
          const regex = /\[\[(.*?)\]\]/g;
          const matches = stdout.match(regex);

          if (matches) {
            const value = matches.map((match) => {
              const value = match.slice(2, -2); // Remove the surrounding [[ and ]]
              return value
            }).join();
            resolve(value.split(",").map(Number).map((value) => {
              console.log(value < 0.00001)
              return ((value < 0 && 0 ) || value)
            }))
            return
          }
          resolve("Error")
        }
      });
    });

    const result = await prediction as string | number[] 
    if(typeof result == "string") {
      throw new BadGatewayException("Gagal")
    }

    
    return {
      "normal" : result[2],
      "mature" : result[1],
      "immature" : result[0],
    }
  }
}
