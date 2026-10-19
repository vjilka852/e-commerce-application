import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CartResponse } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  getCarts(): Observable<CartResponse> {
    return this.http.get<CartResponse>('https://dummyjson.com/carts?limit=0');
  }
}
