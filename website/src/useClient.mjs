import { useEffect, useState } from 'react';

export default function useClient() {
  const [client, setClient] = useState(false);
  useEffect(() => {
    setClient(true);
  }, []);
  return client;
}
