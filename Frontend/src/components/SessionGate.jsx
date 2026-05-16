import useSessionVerification from "../hooks/useSessionVerification";

export default function SessionGate() {
  // Keep UI minimal: session verification happens before protected content.
  const { verifying } = useSessionVerification();

  if (verifying) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  return null;
}


