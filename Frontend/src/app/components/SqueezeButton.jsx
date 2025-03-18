import React from "react";
import styled from "styled-components";

const SqueezeButton = ({ text }) => {
  return (
    <StyledWrapper>
      <button>
        {text}
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  button {
    height: 2.8em;
    width: 9em;
    background: transparent;
    -webkit-animation: jello-horizontal 0.9s both;
    animation: jello-horizontal 0.9s both;
    border: 2px solid #2f80ed;
    outline: none;
    color: #2f80ed;
    cursor: pointer;
    font-size: 17px;
  }

  button:hover {
    background: #2f80ed;
    color: #ffffff;
    animation: squeeze3124 0.9s both;
  }

  @keyframes squeeze3124 {
    0% {
      -webkit-transform: scale3d(1, 1, 1);
      transform: scale3d(1, 1, 1);
    }

    30% {
      -webkit-transform: scale3d(1.25, 0.75, 1);
      transform: scale3d(1.25, 0.75, 1);
    }

    40% {
      -webkit-transform: scale3d(0.75, 1.25, 1);
      transform: scale3d(0.75, 1.25, 1);
    }

    50% {
      -webkit-transform: scale3d(1.15, 0.85, 1);
      transform: scale3d(1.15, 0.85, 1);
    }

    65% {
      -webkit-transform: scale3d(0.95, 1.05, 1);
      transform: scale3d(0.95, 1.05, 1);
    }

    75% {
      -webkit-transform: scale3d(1.05, 0.95, 1);
      transform: scale3d(1.05, 0.95, 1);
    }

    100% {
      -webkit-transform: scale3d(1, 1, 1);
      transform: scale3d(1, 1, 1);
    }
  }
`;

export default SqueezeButton;
