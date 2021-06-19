import { Button } from 'rebass/styled-components'
import { darken } from 'polished'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import {
  ProposalData,
  DelegateCallback,
  usePfxUserVotes,
  usePfxUserDelegatee,
  usePfxDelegateCallback,
  useGAkitaUserVotes,
  useGAkitaUserDelegatee,
  useGAkitaDelegateCallback,
  useAllPfxProposalData,
  useAllGAkitaProposalData
} from '../../state/governance/hooks'
import DelegateModal from '../../components/vote/DelegateModal'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { PFX, ZERO_ADDRESS, gAKITA } from '../../constants'
import { JSBI, TokenAmount, ChainId, Token } from '@polarfox/sdk'
import { shortenAddress, getEtherscanLink } from '../../utils'
import Loader from '../../components/Loader'
import FormattedCurrencyAmount from '../../components/FormattedCurrencyAmount'

import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'
import { RowBetween, RowFixed } from '../../components/Row'
import { Link } from 'react-router-dom'
import { ProposalStatus } from './styled'
import { ButtonPrimary } from '../../components/Button'

import { useModalOpen, useToggleDelegateModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/actions'
import { numberWithCommas } from '../../utils/format'

const PageWrapper = styled(AutoColumn)``

const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const Proposal = styled(Button)`
  padding: 0.75rem 1rem;
  width: 100%;
  margin-top: 1rem;
  border-radius: 12px;
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  align-items: center;
  text-align: left;
  outline: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg1};
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
`

const ProposalNumber = styled.span`
  opacity: 0.6;
`

const ProposalTitle = styled.span`
  font-weight: 600;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;

  `};
`

const TextButton = styled(TYPE.main)`
  color: ${({ theme }) => theme.primary1};
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const AddressButton = styled.div`
  border: 1px solid ${({ theme }) => theme.bg3};
  padding: 2px 4px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.text1};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

interface VoteProps {
  token: Token
  governanceName: string
  minimumBalanceToPropose: number
  userVotes?: TokenAmount
  userDelegatee?: string
  allProposals: ProposalData[]
  delegateCallback: DelegateCallback
}

function Vote({
  token,
  governanceName,
  minimumBalanceToPropose,
  userVotes,
  userDelegatee,
  allProposals,
  delegateCallback
}: VoteProps) {
  const { account } = useActiveWeb3React()

  // toggle for showing delegation modal
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE)
  const toggleDelegateModal = useToggleDelegateModal()

  // user data
  const balance: TokenAmount | undefined = useTokenBalance(account ?? undefined, token)

  // show delegation option if they have have a balance, but have not delegated
  const showUnlockVoting = Boolean(
    balance && JSBI.notEqual(balance.raw, JSBI.BigInt(0)) && userDelegatee === ZERO_ADDRESS
  )

  const symbol = token.symbol ?? ''
  const pageRootPath = `/vote-${symbol.toLowerCase()}`

  return (
    <PageWrapper gap="lg" justify="center">
      <DelegateModal
        isOpen={showDelegateModal}
        title={showUnlockVoting ? 'Unlock Votes' : 'Update Delegation'}
        token={token}
        delegateCallback={delegateCallback}
        onDismiss={toggleDelegateModal}
      />
      <TopSection gap="md">
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>{governanceName}</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  {symbol} tokens represent voting shares in {governanceName} governance. You can vote on each proposal
                  yourself or delegate your votes to a third party.
                </TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  To be eligible to vote, you must hold {symbol} in your wallet and delegate it at the start of voting.
                  After voting has begun, you may pool or spend your {symbol}.
                </TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Governance votes are decided by simple majority. There is no quorum threshold.
                </TYPE.white>
              </RowBetween>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
      </TopSection>
      <TopSection gap="2px">
        <WrapSmall>
          <TYPE.mediumHeader style={{ margin: '0.5rem 0.5rem 0.5rem 0', flexShrink: 0 }}>Proposals</TYPE.mediumHeader>
          {(!allProposals || allProposals.length === 0) && !userVotes && <Loader />}
          {showUnlockVoting ? (
            <ButtonPrimary
              style={{ width: 'fit-content' }}
              padding="8px"
              borderRadius="8px"
              onClick={toggleDelegateModal}
            >
              Unlock Voting
            </ButtonPrimary>
          ) : userVotes && JSBI.notEqual(JSBI.BigInt(0), userVotes?.raw) ? (
            <TYPE.body fontWeight={500} mr="6px">
              <FormattedCurrencyAmount currencyAmount={userVotes} /> Votes
            </TYPE.body>
          ) : balance &&
            userDelegatee &&
            userDelegatee !== ZERO_ADDRESS &&
            JSBI.notEqual(JSBI.BigInt(0), balance?.raw) ? (
            <TYPE.body fontWeight={500} mr="6px">
              <FormattedCurrencyAmount currencyAmount={balance} /> Votes
            </TYPE.body>
          ) : (
            ''
          )}
        </WrapSmall>
        {!showUnlockVoting && (
          <RowBetween>
            <div />
            {userDelegatee && userDelegatee !== ZERO_ADDRESS ? (
              <RowFixed>
                <TYPE.body fontWeight={500} mr="4px">
                  Delegated to:
                </TYPE.body>
                <AddressButton>
                  <StyledExternalLink
                    href={getEtherscanLink(ChainId.FUJI, userDelegatee, 'address')}
                    style={{ margin: '0 4px' }}
                  >
                    {userDelegatee === account ? 'Self' : shortenAddress(userDelegatee)}
                  </StyledExternalLink>
                  <TextButton onClick={toggleDelegateModal} style={{ marginLeft: '4px' }}>
                    (edit)
                  </TextButton>
                </AddressButton>
              </RowFixed>
            ) : (
              ''
            )}
          </RowBetween>
        )}
        {allProposals?.length === 0 && (
          <EmptyProposals>
            <TYPE.body style={{ marginBottom: '8px' }}>No proposals found.</TYPE.body>
            <TYPE.subHeader>
              <i>Proposals submitted by community members will appear here.</i>
            </TYPE.subHeader>
          </EmptyProposals>
        )}
        {allProposals?.map((p: ProposalData, i) => {
          return (
            <Proposal as={Link} to={`${pageRootPath}/${p.id}`} key={i}>
              <ProposalNumber>{p.id}</ProposalNumber>
              <ProposalTitle>{p.title}</ProposalTitle>
              <ProposalStatus status={p.status}>{p.status}</ProposalStatus>
            </Proposal>
          )
        })}
      </TopSection>
      <TYPE.subHeader color="text3">
        A minimum threshold of {numberWithCommas(minimumBalanceToPropose)} {symbol} is required to submit proposals
      </TYPE.subHeader>
    </PageWrapper>
  )
}

export function VotePFX() {
  const { chainId } = useActiveWeb3React()

  const pfx = PFX[chainId ?? ChainId.AVALANCHE]

  const userVotes = usePfxUserVotes()
  const userDelegatee = usePfxUserDelegatee()
  const delegateCallback = usePfxDelegateCallback()
  const allProposals = useAllPfxProposalData()

  return (
    <Vote
      token={pfx}
      governanceName="Polarfox"
      minimumBalanceToPropose={500_000}
      userVotes={userVotes}
      userDelegatee={userDelegatee}
      allProposals={allProposals}
      delegateCallback={delegateCallback}
    />
  )
}

export function VoteGAkita() {
  const { chainId } = useActiveWeb3React()

  const gAkita = gAKITA[chainId ?? ChainId.AVALANCHE]

  const userVotes = useGAkitaUserVotes()
  const userDelegatee = useGAkitaUserDelegatee()
  const delegateCallback = useGAkitaDelegateCallback()
  const allProposals = useAllGAkitaProposalData()

  return (
    <Vote
      token={gAkita}
      governanceName="Akita"
      minimumBalanceToPropose={100}
      userVotes={userVotes}
      userDelegatee={userDelegatee}
      allProposals={allProposals}
      delegateCallback={delegateCallback}
    />
  )
}
