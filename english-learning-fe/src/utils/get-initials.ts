export function getInitials(name: string, fallback = "U") {
  const initials = name
    .split(" ")
    .filter((item) => item.trim().length > 0)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");

  return initials || fallback;
}
