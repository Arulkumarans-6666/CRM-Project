import { Routes, Route } from 'react-router-dom';
import StackDashboard from './dashboard/StackDashboard';
import StackList from './stacks/StackList';
import StackDetails from './stacks/Stackdetails';
import StackMaintenance from './Stack_Maintenance';

const Stackmaintain = () => {
  return (
    <div>
      <h2>Stack Maintenance Panel</h2>
      <Routes>
        <Route path="/" element={<StackDashboard />} />
        <Route path="stacks" element={<StackList />} />
        <Route path="stacks/:id" element={<StackDetails />} />
        <Route path="maintenance" element={<StackMaintenance />} />
      </Routes>
    </div>
  );
};

export default Stackmaintain;
