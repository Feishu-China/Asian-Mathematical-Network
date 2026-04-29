export type OutreachProgram = {
  id: string;
  title: string;
  formatLabel: string;
  summary: string;
};

export type OutreachProvider = {
  listPublicPrograms(): Promise<OutreachProgram[]>;
};
