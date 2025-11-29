import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

const StackList = () => {
  const [stacks, setStacks] = useState([]);

  useEffect(() => {
    API.get('/stacks').then(res => setStacks(res.data));
  }, []);

  return (
    <div>
      <h3>All Stacks</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Used</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {stacks.map(stack => (
            <tr key={stack._id}>
              <td>
                <Link to={`/stack/stacks/${stack._id}`}>{stack.name}</Link>
              </td>
              <td>{stack.quantity}</td>
              <td>{stack.used}</td>
              <td>{stack.quantity - stack.used}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StackList;
