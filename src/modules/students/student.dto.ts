export interface CreateStudentDTO {
  name: string;
  course: string;
  skills: string[];
  availability: string;
  portfolio?: string;
  photoUrl?: string;
  userId: string;
}

export interface UpdateStudentDTO {
  name?: string;
  course?: string;
  skills?: string[];
  availability?: string;
  portfolio?: string;
  photoUrl?: string;
  isVisible?: boolean;
}
