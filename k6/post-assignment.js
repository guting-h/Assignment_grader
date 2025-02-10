import http from "k6/http";
import { crypto } from 'k6/experimental/webcrypto';

export const options = {
  duration: "10s",
  vus: 10,
};

export default function () {

  const data = {
    userUuid: crypto.randomUUID().toString(),
    code: "def hello(): return 'Hello'",
    assgId: 1,
  };

  http.post(
    "http://localhost:7800/api/submit",
    JSON.stringify(data),
  );
}