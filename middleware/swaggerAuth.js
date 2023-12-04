import basicAuth from "basic-auth";

export const authenticate = (req, res, next) => {
  const credentials = basicAuth(req);

  if (
    !credentials ||
    credentials.name !== "noon" ||
    credentials.pass !== "noon"
  ) {
    res.status(401).send("Unauthorized");
    return;
  }

  next();
};
