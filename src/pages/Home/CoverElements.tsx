import { MdArrowForward, MdKeyboardArrowRight } from 'react-icons/md'
import styled from 'styled-components/macro'

export const CoverContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 250px;
`

export const CoverContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 500px;
  align-items: center;

  @media screen and (max-width: 768px) {
    width: 500px;
    font-size: 50px;
  }

  @media screen and (max-width: 480px) {
    width: 380px;
    font-size: 42px;
  }
`

export const CoverH0 = styled.h1`
  color: #fff;
  font-size: 64px;
  text-align: center;

  @media screen and (max-width: 768px) {
    width: 500px;
    font-size: 50px;
  }

  @media screen and (max-width: 480px) {
    width: 380px;
    font-size: 42px;
  }
`

export const CoverH1 = styled.h1`
  color: #fff;
  font-size: 54px;
  text-align: center;
  margin-bottom: 0px;

  @media screen and (max-width: 768px) {
    font-size: 40px;
  }

  @media screen and (max-width: 480px) {
    font-size: 32px;
  }
`

export const CoverP = styled.p`
  color: #c0c0c0;
  font-size: 20px;
  max-width: 400px;
  text-align: center;

  @media screen and (max-width: 768px) {
    width: 400px;
    font-size: 22px;
  }

  @media screen and (max-width: 480px) {
    width: 380px;
    font-size: 18px;
  }
`

export const CoverBtnWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const ArrowForward = styled(MdArrowForward)`
  margin-left: 8px;
  font-size: 20px;
`

export const ArrowRight = styled(MdKeyboardArrowRight)`
  margin-left: 8px;
  font-size: 20px;
`
