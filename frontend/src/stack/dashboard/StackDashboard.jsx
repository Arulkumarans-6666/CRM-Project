import { useEffect, useState } from 'react';
import API from '../../utils/api';

const StackDashboard = () => {
  const [stacks, setStacks] = useState([]);

  useEffect(() => {
    API.get('/stacks').then(res => setStacks(res.data));
  }, []);

  const total = stacks.reduce((sum, s) => sum + s.quantity, 0);
  const used = stacks.reduce((sum, s) => sum + s.used, 0);
  const remaining = total - used;

  return (
    <div>
      <h3>Stack Dashboard</h3>
      <p><strong>Total Stock:</strong> {total} Liters</p>
      <p><strong>Used:</strong> {used} Liters</p>
      <p><strong>Remaining:</strong> {remaining} Liters</p>
    </div>
  );
};

export default StackDashboard;
