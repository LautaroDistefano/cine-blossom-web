import { Component, model } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-search-bar',
  styleUrl: './search-bar.css',
  templateUrl: './search-bar.html',
})
export class SearchBar {
  valor = model<string>('');

  vaciarBarra():void{
    this.valor.set('')
  }
}
