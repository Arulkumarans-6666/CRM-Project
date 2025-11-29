import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../utils/api';

const StackDetails = () => {
  const { id } = useParams();
  const [stack, setStack] = useState(null);

  useEffect(() => {
    API.get(`/stacks/${id}`).then(res => setStack(res.data));
  }, [id]);

  if (!stack) return <p>Loading...</p>;

  const remaining = stack.quantity - stack.used;
  const profit = (stack.used * stack.sellRate) - (stack.quantity * stack.buyRate);

  return (
    <div>
      <h3>Stack Details</h3>
      <p><strong>Name:</strong> {stack.name}</p>
      <p><strong>Total Quantity:</strong> {stack.quantity} L</p>
      <p><strong>Used:</strong> {stack.used} L</p>
      <p><strong>Remaining:</strong> {remaining} L</p>
      <p><strong>Buy Rate:</strong> ₹{stack.buyRate}/L</p>
      <p><strong>Sell Rate:</strong> ₹{stack.sellRate}/L</p>
      <p><strong>Profit:</strong> ₹{profit}</p>
    </div>
  );
};

export default StackDetails;
