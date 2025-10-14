export interface ApprovalState {
  generated: boolean;
  approved: boolean;
}

export interface Spec {
  feature_name: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  language: 'ja' | 'en';
  phase: 'initialized' | 'requirements-generated' | 'design-generated' | 'tasks-generated';
  approvals: {
    requirements: ApprovalState;
    design: ApprovalState;
    tasks: ApprovalState;
  };
  ready_for_implementation: boolean;
}
