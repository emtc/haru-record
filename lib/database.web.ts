// Web stub — expo-sqlite は Web では動作しないため空の実装を返す
import { Treatment, TreatmentPhoto } from '../types';

export function openDb() { return null as any; }
export function getAllTreatments(): Treatment[] { return []; }
export function getTreatmentById(_id: string): Treatment | null { return null; }
export function insertTreatment(_t: Treatment): void {}
export function updateTreatment(_t: Treatment): void {}
export function deleteTreatment(_id: string): void {}
export function getPhotosForTreatment(_treatmentId: string): TreatmentPhoto[] { return []; }
export function insertPhoto(_p: TreatmentPhoto): void {}
export function deletePhoto(_id: string): void {}
export function getAllPhotos(): TreatmentPhoto[] { return []; }
