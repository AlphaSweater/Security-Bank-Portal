import React, { useRef } from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import "./PageTransition.css";

/**
 * Wrap your routed page in this component to animate page transitions.
 *
 * Usage:
 * <PageTransition locationKey={location.key}>
 *   <YourPageComponent />
 * </PageTransition>
 */

const PageTransition = ({ children, locationKey }) => {
  const nodeRef = useRef(null);
  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={locationKey}
        classNames="page"
        timeout={300}
        unmountOnExit
        nodeRef={nodeRef}
      >
        {React.isValidElement(children) && typeof children.type === "string" ? (
          React.cloneElement(children, { ref: nodeRef })
        ) : (
          <div ref={nodeRef}>{children}</div>
        )}
      </CSSTransition>
    </SwitchTransition>
  );
};

export default PageTransition;
