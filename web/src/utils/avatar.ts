const HTTP_PROTOCOL = /^https?:\/\//i;

export const resolveAvatarUrl = (raw?: string | null): string | null => {
  if (!raw) {
    return null;
  }

  if (HTTP_PROTOCOL.test(raw)) {
    return raw;
  }

  return `/api/uploads/profile-pictures/${raw}`;
};
