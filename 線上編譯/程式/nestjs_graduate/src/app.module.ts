import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TodoModule } from './features/todo/todo.module';
import { LoggerMiddleware } from './middlewares/logger/logger.middleware';
import { JwtController } from './jwt/jwt/jwt.controller';
import { JwtService } from './jwt/jwt/jwt.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        TodoModule,
    ],
    controllers: [AppController, JwtController],
    providers: [AppService, JwtService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes(
            { path: '/todos', method: RequestMethod.POST },
            { path: '/', method: RequestMethod.GET },
        )
    }
}
