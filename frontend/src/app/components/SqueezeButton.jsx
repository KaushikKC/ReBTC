"use client";

import React from "react";
import styled from "styled-components";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SqueezeButton = ({ text, to, onClick }) => {
  const pathname = usePathname();
  const isActive = to ? pathname === to || pathname === `${to}/` : false;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (to && !onClick) {
    return (
      <StyledWrapper $isActive={isActive}>
        <Link href={to} passHref>
          <button className={isActive ? "active" : ""}>
            {text}
          </button>
        </Link>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper $isActive={isActive}>
      <button onClick={handleClick} className={isActive ? "active" : ""}>
        {text}
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  button {
    height: 2.8em;
    padding: 0 1em;
    background: ${props => (props.$isActive ? "#f7931a" : "transparent")};
    border: 2px solid #f7931a;
    outline: none;
    color: ${props => (props.$isActive ? "#ffffff" : "#f7931a")};
    cursor: pointer;
    font-size: 17px;
    position: relative;
    transition: background-color 0.3s ease, color 0.3s ease;

    &.active {
      background: #f7931a;
      color: #ffffff;
    }

    ${props =>
      !props.$isActive &&
      `
      &:after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: #f7931a;
        top: 0;
        left: 0;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }
    `};
  }

  button:hover {
    background: #f7931a;
    color: #ffffff;
    animation: ${props => (props.$isActive ? "none" : "squeeze3124 0.9s both")};
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
