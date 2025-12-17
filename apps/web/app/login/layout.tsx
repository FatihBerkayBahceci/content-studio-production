export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page has its own minimal layout without sidebar/header
  return <>{children}</>;
}
