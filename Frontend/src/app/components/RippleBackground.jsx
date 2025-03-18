import React from "react";
import styled from "styled-components";

const RippleBackground = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 1em;
    overflow: hidden;
    padding: 40px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .container::before {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-radial-gradient(
        circle at 50% 50%,
        rgba(0, 128, 128, 0.1) 0%,
        transparent 30%
      ),
      repeating-radial-gradient(
        circle at 50% 50%,
        #00796b 0%,
        #00796b 5px,
        transparent 5px,
        transparent 10px
      );
    opacity: 0.2;
    z-index: -1;
  }

  .container::after {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-radial-gradient(
      circle at 50% 50%,
      rgba(0, 128, 128, 0.1) 0%,
      transparent 50%
    );
    background-size: 80px 80px;
    opacity: 0.1;
    z-index: -1;
  }
`;

export default RippleBackground;
