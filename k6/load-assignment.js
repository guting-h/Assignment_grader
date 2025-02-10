import http from "k6/http";
import { crypto } from 'k6/experimental/webcrypto';

export const options = {
  duration: "10s",
  vus: 10,
};

export default function () {
  const userID = crypto.randomUUID().toString()
  http.get(
    `http://localhost:7800/api/active-assg?userUuid=${userID}`
  );
}