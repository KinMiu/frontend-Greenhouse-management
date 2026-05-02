export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || "";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData;
    } catch (e) {
      console.log("Failed to parse JSON from backend");
    }
    throw new Error(errorMessage || "Request failed");
  }

  return res.json();
}
