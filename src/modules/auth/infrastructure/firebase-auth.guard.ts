import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Firebase Authentication Guard
 * 
 * Protects routes that require Firebase authentication
 * 
 * Usage:
 * @UseGuards(FirebaseAuthGuard)
 * async firebaseLoginRequired() { ... }
 */
@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase') {}
