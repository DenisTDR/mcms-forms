export interface FormSubmitResponse {
  model: any;
  status: string;
  reason: string;
  snack: string;
  snackType: string;
  snackDuration: number;
  skipEmitDone: boolean;
}
