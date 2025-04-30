// PortalComponent.jsx
import ReactDOM from 'react-dom';

const PortalComponent = ({ children }) => {
  return ReactDOM.createPortal(
    children,
    document.getElementById('portal-root')
  );
};

export default PortalComponent;