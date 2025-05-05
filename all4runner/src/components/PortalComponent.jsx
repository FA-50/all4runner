// PortalComponent.jsx
import ReactDOM from 'react-dom';

// ReactDOM.createPortal를 활용해 Modal을 Map 위에 표현.
const PortalComponent = ({ children }) => {
  return ReactDOM.createPortal(
    children,
    document.getElementById('portal-root')
  );
};

export default PortalComponent;