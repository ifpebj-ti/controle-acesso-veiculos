import { RouterProvider } from 'react-router-dom';

import { DemoProvider } from './demo';
import { router } from './routes';

export default function App() {
  return (
    <DemoProvider>
      <RouterProvider router={router} />
    </DemoProvider>
  );
}
