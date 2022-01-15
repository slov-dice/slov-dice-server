// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { bindNodeCallback, Observable, of } from 'rxjs';
// import * as jwt from 'jsonwebtoken';
// import { catchError, flatMap, map } from 'rxjs/operators';

// import { UserEntity } from 'src/modules/users/entities/user.entity';
// import { AuthService } from 'src/modules/auth/auth.service';
// import { JwtPayload } from 'src/modules/auth/interfaces/payload.interface';

// @Injectable()
// export class WsJwtGuard implements CanActivate {
//   constructor(
//     protected readonly authService: AuthService,
//     protected readonly config: ConfigService,
//   ) {}

//   canActivate(context: ExecutionContext): Observable<boolean> {
//     // Получение данных из запроса
//     const data = context.switchToWs().getData();

//     const authHeader = data.headers.authorization;
//     const authToken = authHeader.substring(7, authHeader.length);
//     const verify: (...args: any[]) => Observable<JwtPayload> = bindNodeCallback(
//       jwt.verify,
//     ) as any;

//     return verify(
//       authToken,
//       this.config.get<string>('JWT_SECRET_AT'),
//       null,
//     ).pipe(
//       flatMap((jwtPayload) => this.authService.validateUser(jwtPayload)),
//       catchError((e) => {
//         console.error(e);
//         return of(null);
//       }),
//       map((user: UserEntity | null) => {
//         const isVerified = Boolean(user);

//         if (!isVerified) {
//           throw new UnauthorizedException();
//         }

//         const request = context.switchToHttp().getRequest();
//         request.user = user;

//         return isVerified;
//       }),
//     );
//   }
// }
