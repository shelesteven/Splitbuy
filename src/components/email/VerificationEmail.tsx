import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  url: string;
}

export const VerificationEmail = ({ url }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <Text style={title}>Splitbuy</Text>
          <Text style={text}>Hi there,</Text>
          <Text style={text}>
            Welcome to Splitbuy! We&apos;re excited to have you on board. Please
            click the button below to verify your email address and complete your
            registration.
          </Text>
          <Button style={button} href={url}>
            Verify Email
          </Button>
          <Text style={text}>
            If you didn&apos;t create an account, you can safely ignore this email.
          </Text>
          <Text style={text}>Thanks,</Text>
          <Text style={text}>The Splitbuy Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const title = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  paddingBottom: "20px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
};

const button = {
  backgroundColor: "#5e6ad2",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
}; 