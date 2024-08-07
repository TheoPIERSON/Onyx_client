import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { TypePrestation } from 'src/app/core/models/type_prestation';
import { TypePrestationService } from 'src/app/core/services/type-prestation.service';

@Component({
  selector: 'app-prestation-card-details',
  templateUrl: './prestation-card-details.component.html',
  styleUrl: './prestation-card-details.component.css',
})
export class PrestationCardDetailsComponent implements OnInit {
  typePrestation$: Observable<TypePrestation[]> = this.getTypePrestation();

  constructor(private typePrestationService: TypePrestationService) {}
  ngOnInit(): void {
    this.getTypePrestation().subscribe(
      (data) => {
        console.log(data); // Affiche les données dans la console
      },
      (error) => {
        console.error(error); // Affiche les erreurs dans la console s'il y en a
      }
    );
  }

  private getTypePrestation(): Observable<TypePrestation[]> {
    return this.typePrestationService.fetchTypePrestation();
  }
}
