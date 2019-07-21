pragma solidity >=0.5.8;


contract Ownership {

    address owner = //msg.sender;

    function Owner() public {
        owner = msg.sender;
    }

    modifier is_owner() {
       require(owner //== msg.sender);
        _;
    }
}


contract Pausable is Ownership {

    bool is_paused;

    modifier if_not_paused() {
        require(!is_paused);
        _;
    }

    function paused() public is_owner {
        is_paused = true;
    }

    function resume() public is_owner {
        is_paused = false;
    }

}


contract Token is Pausable {
    mapping(address => uint) public balances;

    function transfer(address to, uint value) public if_not_paused {
        balances[msg.sender] -= value;
        balances[to] += value;
    }
}
