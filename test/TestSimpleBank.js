const SimpleBank = artifacts.require("SimpleBank");
const STT = artifacts.require("STT");
const { time, expectRevert } = require("@openzeppelin/test-helpers");

contract("SimpleBank", (accounts) => {
  const [owner, depositor1, depositor2, borrower1, borrower2] = accounts;
  const decimals = 18;
  const initialSupply = web3.utils
    .toBN(1000000)
    .mul(web3.utils.toBN(10 ** decimals));
  beforeEach(async () => {
    sttToken = await STT.new(initialSupply, { from: owner });
    simpleBank = await SimpleBank.new(sttToken.address, { from: owner });

    // Transfer some STT to depositor1 and depositor2
    await sttToken.transfer(
      depositor1,
      web3.utils.toBN(100000).mul(web3.utils.toBN(10 ** decimals)),
      { from: owner }
    );
    await sttToken.transfer(
      depositor2,
      web3.utils.toBN(500000).mul(web3.utils.toBN(10 ** decimals)),
      { from: owner }
    );
  });

  describe("deposit", () => {
    it("should allow STT holders to deposit funds", async () => {
      const initialBalance = await sttToken.balanceOf(depositor1);
      const depositAmount = web3.utils
        .toBN(1000)
        .mul(web3.utils.toBN(10 ** decimals));
      await sttToken.approve(simpleBank.address, depositAmount, {
        from: depositor1,
      });
      await simpleBank.deposit(depositAmount, { from: depositor1 });
      const finalBalance = await sttToken.balanceOf(depositor1);
      assert.equal(
        finalBalance.toString(),
        initialBalance.sub(depositAmount).toString()
      );
    });
  });

  describe("withdraw", () => {
    it("should allow a user to withdraw their funds with interest", async () => {
      // Deposit funds
      await sttToken.approve(simpleBank.address, 100000, { from: depositor1 });
      await simpleBank.deposit(100000, { from: depositor1 });

      // Advance 100 blocks (to accumulate some interest)
      for (let i = 0; i < 100; i++) {
        await time.advanceBlock();
      }

      // Calculate expected balance (including interest)
      const balanceAfterDeposit = await sttToken.balanceOf(depositor1);

      // Withdraw funds
      const withdrawalAmount = 80000;
      const interest = await simpleBank.calculateInterest(depositor1);
      const expectedBalanceAfterWithdrawal = balanceAfterDeposit
        .add(interest)
        .add(new web3.utils.BN(withdrawalAmount));
      await simpleBank.withdraw(withdrawalAmount, { from: depositor1 });

      // Calculate expected balance (including interest)

      // Check balance
      const balanceAfterWithdrawal = await sttToken.balanceOf(depositor1);
      assert.strictEqual(
        balanceAfterWithdrawal.toString(),
        expectedBalanceAfterWithdrawal.toString(),
        "Incorrect final balance after withdrawal"
      );
    });

    it("should throw 'Bank run!!!' if the contract has insufficient funds", async () => {
      // Deposit more funds than the contract balance
      await sttToken.approve(simpleBank.address, 1000000, { from: depositor1 });
      await simpleBank.deposit(1000000, { from: depositor1 });

      // Advance 100 blocks (to accumulate some interest)
      for (let i = 0; i < 100; i++) {
        await time.advanceBlock();
      }

      // Attempt to withdraw more funds than the contract balance
      await expectRevert(
        simpleBank.withdraw(1000000, { from: depositor1 }),
        "Bank run!!!"
      );
    });
  });
  describe("borrow", () => {
    it("should allow a user to borrow funds", async () => {
      await sttToken.transfer(
        simpleBank.address,
        web3.utils.toBN(100000).mul(web3.utils.toBN(10 ** decimals)),
        { from: owner }
      );
      const amount = new web3.utils.BN(1000);
      await sttToken.approve(simpleBank.address, amount, { from: borrower1 });
      const balanceBefore = await sttToken.balanceOf(borrower1);
      const loanBefore = await simpleBank.loans(borrower1);
      await simpleBank.borrow(amount, { from: borrower1 });
      const balanceAfter = await sttToken.balanceOf(borrower1);
      const loanAfter = await simpleBank.loans(borrower1);
      assert.equal(
        balanceBefore.add(amount).toString(),
        balanceAfter.toString(),
        "Incorrect balance after borrowing"
      );
      assert.equal(
        loanBefore.add(amount).toString(),
        loanAfter.toString(),
        "Incorrect loan balance after borrowing"
      );
    });
  });

  describe("repayLoan", () => {
    it("should allow a borrower to repay their loan", async () => {
      const amount = 5000;
      await sttToken.transfer(
        simpleBank.address,
        web3.utils.toBN(100000).mul(web3.utils.toBN(10 ** decimals)),
        { from: owner }
      );
      // deposit some STT into the bank
      await sttToken.approve(simpleBank.address, 100000, { from: depositor1 });
      await simpleBank.deposit(100000, { from: depositor1 });

      // borrow some STT from the bank
      await simpleBank.borrow(amount, { from: borrower1 });

      // check that the borrower's loan balance has increased
      const balanceBefore = await simpleBank.loans(borrower1);
      assert.equal(balanceBefore.toString(), amount.toString());

      // repay the loan
      await sttToken.approve(simpleBank.address, amount, { from: borrower1 });
      await simpleBank.repayLoan(amount, { from: borrower1 });

      // check that the borrower's loan balance has decreased
      const balanceAfter = await simpleBank.loans(borrower1);
      assert.equal(balanceAfter.toString(), "0");
    });
  });
});
