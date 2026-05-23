export interface OwnerSpecFrontmatter {
  tool: string;
  last_attested: string;
  max_unattested_days: number;
  couples_with: string[];
  convention_version: number;
  output_schema_hash?: string;
}

export interface OwnerSpec {
  path: string;
  toolDir: string;
  frontmatter: OwnerSpecFrontmatter;
}

export interface StalenessFinding {
  tool: string;
  spec_path: string;
  reason: 'age' | 'coupling' | 'schema-hash';
  detail: string;
  age_days?: number;
  coupling_changes?: string[];
}

export interface CouplingFinding {
  tool: string;
  spec_path: string;
  touched_files: string[];
  spec_touched: boolean;
}
