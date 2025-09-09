import { Job, Payment, User, WorkerRequest } from "@prisma/client";

export interface JobFromApi extends Job {
  assignedTo: User;
  payments: Payment[];
  company: User;
}
export type ToWorkerRequestResponce = [{ toUser: User } & WorkerRequest];
export type FromWorkerRequestResponce = [{ fromUser: User } & WorkerRequest];
