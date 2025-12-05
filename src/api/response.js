export const unwrapResult = (response) => {
  const data = response.data;

  if (!data.isSuccess) {
    const error = new Error(data.message || "요청에 실패했습니다.");
    error.code = data.code;
    throw error;
  }

  return data.result;
};
