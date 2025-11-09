import api from "./client";

// Image upload helper
export async function uploadImage(file: File, token?: string | null) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/uploads`, form, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "multipart/form-data",
    },
  });
  // Swagger: { status, message, statusCode, data: { imageUrl: "..." } }
  const payload: any = data?.data ?? data;
  const url = payload?.imageUrl ?? payload?.url ?? payload?.location ?? payload?.fileUrl ?? payload?.path ?? "";
  return url as string;
}
