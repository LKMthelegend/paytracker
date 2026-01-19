import { Department, Position } from "@/types";

/**
 * Trouve le nom d'un département à partir de son ID
 */
export function getDepartmentName(departmentId: string, departments: Department[]): string {
  const department = departments.find(d => d.id === departmentId);
  return department?.name || departmentId;
}

/**
 * Trouve le nom d'un poste à partir de son ID
 */
export function getPositionName(positionId: string, positions: Position[]): string {
  const position = positions.find(p => p.id === positionId);
  return position?.name || positionId;
}
