// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./STT.sol";

contract SimpleBank {
    STT public sttToken;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public loans;
    uint256 public totalDeposits;

    uint256 public constant MAX_LOAN_RATIO = 80;
    uint256 public constant INTEREST_RATE = 10;  // 0.01%
    uint256 public constant LOAN_INTEREST_RATE = 100;  // 0.1%
    uint256 public constant FUND_RESERVE_RATIO = 50;  // 50%
    uint256 public constant BLOCKS_PER_YEAR = 2102400;  // assuming 15 sec block time

    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    event Loan(address indexed account, uint256 amount);
    event LoanRepayment(address indexed account, uint256 amount);

    constructor(address _sttToken) {
        sttToken = STT(_sttToken);
    }

    function deposit(uint256 _amount) public {
        require(sttToken.transferFrom(msg.sender, address(this), _amount));
        deposits[msg.sender] += _amount;
        totalDeposits += _amount;
        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) public {
      require(_amount <= deposits[msg.sender]);
      uint256 interest = calculateInterest(msg.sender);
      require(sttToken.balanceOf(address(this)) >= _amount + interest, "Bank run!!!");
      deposits[msg.sender] -= _amount;
      totalDeposits -= _amount;
      require(sttToken.transfer(msg.sender, _amount + interest));
      emit Withdrawal(msg.sender, _amount);
    }

    function borrow(uint256 _amount) public {
        uint256 availableBalance = sttToken.balanceOf(address(this)) - totalDeposits;
        require(_amount <= availableBalance * MAX_LOAN_RATIO / 100, "not enough fund");
        uint256 interest = calculateInterest(msg.sender);
        require(sttToken.transfer(msg.sender, _amount - interest));
        deposits[msg.sender] += interest;
        loans[msg.sender] += _amount;
        emit Loan(msg.sender, _amount);
    }

    function repayLoan(uint256 _amount) public {
        require(_amount <= loans[msg.sender]);
        require(sttToken.transferFrom(msg.sender, address(this), _amount));
        loans[msg.sender] -= _amount;
        emit LoanRepayment(msg.sender, _amount);
    }

    function calculateInterest(address _account) public view returns (uint256) {
        uint256 depositInterest = deposits[_account] * INTEREST_RATE / 10000 * BLOCKS_PER_YEAR / 86400;
        uint256 loanInterest = loans[_account] * LOAN_INTEREST_RATE / 10000 * BLOCKS_PER_YEAR / 86400;
        return depositInterest > loanInterest ? depositInterest - loanInterest : 0;
    }

    function getBankBalance() public view returns (uint256) {
    return sttToken.balanceOf(address(this));
}


}