import { Job, Payment, User } from "@prisma/client";

export interface JobFromApi extends Job {
  assignedTo: User;
  payments: Payment[];
  company: User;
}