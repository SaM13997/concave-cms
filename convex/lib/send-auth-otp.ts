type SendAuthOtpArgs = {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
};

type SendAuthOtpOptions = {
  env?: string;
  log?: (message: string) => void;
};

export async function sendAuthOtpEmail(
  { email, otp, type }: SendAuthOtpArgs,
  options: SendAuthOtpOptions = {},
) {
  const env = options.env ?? process.env.NODE_ENV;
  const log = options.log ?? console.info;
  const message = `[auth:${type}] OTP for ${email}: ${otp}`;

  if (env === "production") {
    throw new Error("No auth email transport configured for production");
  }

  log(message);
}
