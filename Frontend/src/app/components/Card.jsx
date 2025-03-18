import React from "react";
import styled from "styled-components";

const Card = () => {
  return (
    <StyledWrapper>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 614 390"
        height={390}
        width={614}
      >
        <g id="Frame">
          <g id="box-figma">
            <text x="50" y="120" fill="#ffffff" fontSize="42">
              Restake your BTC.
              <tspan x="200" dy="50">
                &{" "}
              </tspan>
              <tspan x="50" dy="50">
                Maximize Your Yield.
              </tspan>
            </text>

            <g id="box">
              <path
                strokeWidth={2}
                stroke="#2563EB"
                fillOpacity="0.05"
                fill="#2563EB"
                d="M587 20H28V306H587V20Z"
                id="figny9-box"
              />
              <path
                strokeWidth={2}
                stroke="#2563EB"
                fill="white"
                d="M33 15H23V25H33V15Z"
                id="figny9-adjust-1"
              />
              <path
                strokeWidth={2}
                stroke="#2563EB"
                fill="white"
                d="M33 301H23V311H33V301Z"
                id="figny9-adjust-3"
              />
              <path
                strokeWidth={2}
                stroke="#2563EB"
                fill="white"
                d="M592 301H582V311H592V301Z"
                id="figny9-adjust-4"
              />
              <path
                strokeWidth={2}
                stroke="#2563EB"
                fill="white"
                d="M592 15H582V25H592V15Z"
                id="figny9-adjust-2"
              />
            </g>
            <g id="cursor">
              <path
                strokeWidth={2}
                stroke="white"
                fill="#2563EB"
                d="M453.383 343L448 317L471 331L459.745 333.5L453.383 343Z"
                id="Vector 273"
              />
              <path
                fill="#2563EB"
                d="M587 343H469.932V376H587V343Z"
                id="Rectangle 786"
              />
              <text
                x="480"
                y="363"
                fill="white"
                fontSize="14"
                fontFamily="Arial"
              >
                ReBTC
              </text>
            </g>
          </g>
        </g>
      </svg>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  #cursor,
  #box,
  text {
    cursor: pointer;
  }
  #cursor {
    overflow: visible;
    transform: translate3d(300px, 0, 0) scale(1);
    transform-origin: center center;
    transform-box: fill-box;
    animation: cursor 5s ease infinite alternate;
  }
  @keyframes cursor {
    0% {
      opacity: 0;
      transform: translate3d(300px, 0, 0) scale(1);
    }
    30% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
    60% {
      opacity: 1;
      transform: translate3d(-200px, -200px, 0) scale(1);
    }
    65% {
      opacity: 1;
      transform: translate3d(-200px, -200px, 0) scale(0.95);
    }
    70% {
      opacity: 1;
      transform: translate3d(-200px, -200px, 0) scale(1);
    }
    100% {
      opacity: 1;
      transform: translate3d(-300px, -50px, 0) scale(1);
    }
  }

  #box {
    opacity: 0;
    animation: box 5s ease infinite alternate;
  }
  @keyframes box {
    0%,
    60% {
      opacity: 0;
    }
    65%,
    100% {
      opacity: 1;
    }
  }

  text {
    font-weight: bold;
    letter-spacing: 0.5px;
  }
`;

export default Card;
