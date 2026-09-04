export {
  createInstitutionalVehicle,
  deactivateInstitutionalVehicle,
  InstitutionalVehiclesContractError,
  listInstitutionalVehicles,
  updateInstitutionalVehicle,
} from "./services/institutionalVehiclesService";
export { InstitutionalVehicleForm } from "./components/InstitutionalVehicleForm";
export type { InstitutionalVehicleField } from "./components/InstitutionalVehicleForm";
export { InstitutionalVehicleCatalog } from "./components/InstitutionalVehicleCatalog";
export {
  institutionalVehicleFormSchema,
  institutionalVehicleListSchema,
  institutionalVehicleSchema,
} from "./schemas/institutionalVehicleSchemas";
export type { InstitutionalVehicleFormValues } from "./schemas/institutionalVehicleSchemas";
export type { InstitutionalVehicle, InstitutionalVehicleInput } from "./types";
