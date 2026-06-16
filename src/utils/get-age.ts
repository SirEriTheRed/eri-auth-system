/**
 * Calculates the age from a birthday date.
 *
 * @param birthday - The date of birth
 * @returns The age in years, accounting for whether the birthday has passed this year
 *
 * @remarks
 * Age is computed as:
 * ```
 * age = today.getFullYear() - birthday.getFullYear();
 * if (today's month/day is before birthday) age--;
 * ```
 */
export function getAge(birthday: Date): number {
  const today: Date = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}
