export type GroupOverview = {
  uuid: string;
  name: string;
  score: number;
};

export type ScoreOverview = {
  uuid: string;
  createdAt: Date;
  gameGroupUuid: string;
  username: string;
  amount: number;
  special: boolean;
};

export type ScoreOverviewSparse = Omit<ScoreOverview, "gameGroupUuid"> & {
  cumScore: number;
};

export type ScoreOverviewExtended = ScoreOverview & {
  name: string;
};

export type GroupGetResponse = {
  uuid: string;
  name: string;
  score: number;
  scores: ScoreOverviewSparse[];
  qualified?: boolean;
  candidate?: boolean;
  color: string;
};
