import { Component, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TypePrestation } from 'src/app/core/models/type_prestation';
import { TypePrestationService } from 'src/app/core/services/type-prestation.service';
import { jwtDecode } from 'jwt-decode';
import { CustomerService } from 'src/app/core/services/customer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Appointments } from 'src/app/core/models/appointmentModel';
import { Type_prestation } from 'src/app/core/classes/type_prestation_class';
import { FormBuilder } from '@angular/forms';
import { AppointmentService } from 'src/app/core/services/AppointmentService/appointment.service';
import { TypePrestationIdService } from 'src/app/core/services/Type_prestation/type-prestation-id.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AppointmentModalComponent } from '../appointment-modal/appointment-modal.component';

@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css'],
})
export class BookingFormComponent implements OnInit {
  minDate: Date = new Date();
  maxDate: Date;

  selectedPrestation: string | undefined; // Nouvelle propriété pour stocker la valeur de l'input prestation
  selectedDate: Date = new Date();
  dateToString: string = this.selectedDate.toLocaleDateString();
  selectedHour: string = '10:00';

  customerId: number = 0;
  customerFirstname: string = '';
  customerLastname: string = '';
  customerPhoneNumber: string = '';
  customerEmail: string = '';
  customerBirthdate: string = '';
  customerPassword: string = '';

  decodedToken: any; // Pour stocker les informations du JWT décrypté
  takenHours: { start: string; end: string }[] = [];

  typePrestation$: Observable<TypePrestation[]> = this.getTypePrestation();
  appointments$: Observable<Appointments[]> = this.getAppointments();

  constructor(
    private typePrestationService: TypePrestationService,
    private typePrestationIdService: TypePrestationIdService,
    private customerService: CustomerService,
    private appointmentService: AppointmentService,
    public matDialog: MatDialog,
    private fb: FormBuilder
  ) {
    // Ajouter 3 mois à maxDate
    this.maxDate = new Date(this.minDate);
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);
  }
  ngOnInit(): void {
    console.log(this.dateToString);

    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.decodedToken = jwtDecode(accessToken); // Décoder le JWT
      console.log('Informations du JWT décryptées :', this.decodedToken.id);
    }
  }
  private getTypePrestation(): Observable<Type_prestation[]> {
    return this.typePrestationService.fetchTypePrestation();
  }
  private getAppointments(): Observable<Appointments[]> {
    return this.appointmentService.fetchAppointments();
  }

  public dateFilter = (date: any) => {
    const day = date.getDay();
    return day != 0 && day != 6;
  };

  selectHour(hour: string) {
    this.selectedHour = hour;
  }

  getCustomerById(id: string) {
    let idCustomer = this.decodedToken.id;
    // Appel du service pour trouver le client par son identifiant
    this.customerService.findCustomerById(idCustomer).subscribe((customer) => {
      console.log('Informations du client :', customer);
      // Assignation de l'ID du client à la variable customerId
      this.customerId = customer.id;
    });
  }

  onSubmit() {
    let selectedPrestationDuration: number = 0;
    let selectedPrestationId: number = 0;
    if (this.selectedPrestation) {
      // Séparation de la chaîne en utilisant le tiret comme délimiteur
      const parts = this.selectedPrestation.split('-');
      // Extrait le nombre au début de la chaîne et le convertit en entier
      selectedPrestationDuration = parseInt(parts[0], 10);
      selectedPrestationId = parseInt(parts[1]);
      // Utilisez selectedPrestationDuration comme bon vous semble
      console.log(selectedPrestationDuration); // Affiche 20
    } else {
      console.log("selectedPrestation n'est pas défini");
    }

    console.log('Date sélectionnée :', this.selectedDate);
    console.log('Heure sélectionnée :', this.selectedHour);

    // Construire la date de début
    let startDate: Date = new Date(this.selectedDate);
    if (this.selectedHour) {
      const [hours, minutes] = this.selectedHour.split(':');
      startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }
    console.log('La date de début :', startDate);

    // Calculer la date de fin
    const endDate: Date = new Date(
      startDate.getTime() + selectedPrestationDuration * 60000
    ); // Convertir les minutes en millisecondes (1 minute = 60000 millisecondes)

    console.log('La date de fin :', endDate);

    // Appeler la méthode pour récupérer les informations du client
    this.getCustomerById(this.decodedToken.id);
    let selectedCustomerId = this.customerId;
    let selectedCustomerFirstname = this.customerFirstname;
    let selectedCustomerLastname = this.customerLastname;
    let selectedCustomerPhoneNumber = this.customerPhoneNumber;
    let selectedCustomerEmail = this.customerEmail;
    let selectedCustomerBirthdate = this.customerBirthdate;
    let selectedCustomerPassword = this.customerPassword;

    const appointmentObj: Appointments = {
      id: 0,
      appointmentStartDate: startDate,
      appointmentEndDate: endDate,
      customer: {
        id: selectedCustomerId,
        firstname: selectedCustomerFirstname,
        lastname: selectedCustomerLastname,
        phoneNumber: selectedCustomerPhoneNumber,
        email: selectedCustomerEmail,
        birthdate: selectedCustomerBirthdate,
        password: selectedCustomerPassword,
      },
    };
    this.appointmentService
      .addAppointment(appointmentObj)
      .subscribe((response: Appointments) => {});
    this.typePrestationService.findById(selectedPrestationId).subscribe(
      (res: TypePrestation) => {
        this.typePrestationIdService.setSelectedTypePrestationId(
          selectedPrestationId
        );
        this.openModal(); // Ouvrez la modale avec les informations du client
      },
      (error: HttpErrorResponse) => {
        console.error(error);
      }
    );
  }
  onDateChange(date: Date) {
    const twentyHoursInMilliseconds = 20 * 60 * 60 * 1000; // 20 heures en millisecondes
    console.log('Date sélectionnée :', date);

    const startDate: string = date.toISOString(); // Convertir la date de début en chaîne de caractères
    const endDate: Date = new Date(date.getTime() + twentyHoursInMilliseconds);
    const endDateStr: string = endDate.toISOString(); // Convertir la date de fin en chaîne de caractères

    this.appointmentService.findByDate(startDate, endDateStr);
    this.isThereAppointmentOnDate(startDate, endDateStr);
  }

  openModal() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = 'modal-component';
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(
      AppointmentModalComponent,
      dialogConfig
    );
  }
  isThereAppointmentOnDate(startDate: string, endDate: string) {
    this.appointmentService.findByDate(startDate, endDate).subscribe(
      (appointments: any[]) => {
        if (appointments.length === 0) {
          console.log('Aucun rdv à cette date');
        } else {
          this.takenHours = appointments.map((appointment) => {
            const appointmentStartDate = new Date(
              appointment.appointmentStartDate
            );
            const appointmentEndDate = new Date(appointment.appointmentEndDate);

            const startHour = appointmentStartDate
              .toTimeString()
              .substring(0, 5);
            const endHour = appointmentEndDate.toTimeString().substring(0, 5);

            console.log(`Rendez-vous de ${startHour} à ${endHour}`);

            return { start: startHour, end: endHour };
          });
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération des rendez-vous', error);
      }
    );
  }
  isHourAvailable(hour: string): boolean {
    const [hourStart, minuteStart] = hour.split(':').map(Number);
    const start = new Date(this.selectedDate);
    start.setHours(hourStart, minuteStart, 0, 0);

    for (const interval of this.takenHours) {
      const [hourIntervalStart, minuteIntervalStart] = interval.start
        .split(':')
        .map(Number);
      const [hourIntervalEnd, minuteIntervalEnd] = interval.end
        .split(':')
        .map(Number);

      const intervalStart = new Date(this.selectedDate);
      intervalStart.setHours(hourIntervalStart, minuteIntervalStart, 0, 0);

      const intervalEnd = new Date(this.selectedDate);
      intervalEnd.setHours(hourIntervalEnd, minuteIntervalEnd, 0, 0);

      if (start >= intervalStart && start < intervalEnd) {
        return false;
      }
    }

    return true;
  }
}
