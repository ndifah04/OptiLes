import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDTO {

    @ApiProperty({description : "Email of the user", type : String, example : "username"})
    @IsEmail()
    email: string;

    @ApiProperty({description :"Password", type : String, example : "password"})
    @IsString()
    password: string;
}