import MessageForm from '@/components/message-form';
import ApiSidebar from '@/components/api-sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0">
        <MessageForm />
      </main>
      <ApiSidebar />
    </div>
  );
}
