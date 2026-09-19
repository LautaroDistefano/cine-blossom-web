// product-card.ts
import { Component, input, output } from '@angular/core';
import { ProductoCandyBar } from '../../../core/models/producto-candybar.interface';

@Component({
  selector: 'app-product-card',
  imports: [],
  styleUrl: './product-card.css',
  templateUrl: './product-card.html',
})
export class ProductCard {
  producto = input.required<ProductoCandyBar>();
  cantidad = input<number>(0);

  agregar = output<string>();
  quitar = output<string>();
}